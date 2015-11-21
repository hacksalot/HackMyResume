/**
FRESH to JSON Resume conversion routiens.
@license MIT. Copyright (c) 2015 James M. Devlin / FluentDesk
*/

(function(){

  /**
  Convert between FRESH and JRS resume/CV formats.
  @class FRESHConverter
  */
  var FRESHConverter = module.exports = {


    /**
    Convert from JSON Resume format to FRESH.
    */
    toFRESH: function( src, foreign ) {

      foreign = (foreign === undefined || foreign === null) ? true : foreign;

      return {

        name: src.basics.name,

        info: {
          label: src.basics.label,
          class: src.basics.class, // <--> round-trip
          image: src.basics.picture,
          brief: src.basics.summary
        },

        contact: {
          email: src.basics.email,
          phone: src.basics.phone,
          website: src.basics.website,
          other: src.basics.other // <--> round-trip
        },

        meta: meta( true, src.meta ),

        location: {
          city: src.basics.location.city,
          region: src.basics.location.region,
          country: src.basics.location.countryCode,
          code: src.basics.location.postalCode,
          address: src.basics.location.address
        },

        employment: {
          history: src.work.map( function( job ) {
            return {
              position: job.position,
              employer: job.company,
              summary: job.summary,
              current: (!job.endDate || !job.endDate.trim() || job.endDate.trim().toLowerCase() === 'current') || undefined,
              start: job.startDate,
              end: job.endDate,
              url: job.website,
              keywords: "",
              highlights: job.highlights
            };
          })
        },

        education: {
          history: src.education.map(function(edu){
            return {
              institution: edu.institution,
              start: edu.startDate,
              end: edu.endDate,
              grade: edu.gpa,
              curriculum: edu.courses,
              url: edu.website || edu.url || null,
              summary: null,
              area: edu.area,
              studyType: edu.studyType
            };
          })
        },

        service: {
          history: src.volunteer.map(function(vol) {
            return {
              type: 'volunteer',
              position: vol.position,
              organization: vol.organization,
              start: vol.startDate,
              end: vol.endDate,
              url: vol.website,
              summary: vol.summary,
              highlights: vol.highlights
            };
          })
        },

        skills: skillsToFRESH( src.skills ),

        writing: src.publications.map(function(pub){
          return {
            title: pub.name,
            flavor: undefined,
            publisher: pub.publisher,
            url: pub.website,
            date: pub.releaseDate,
            summary: pub.summary
          };
        }),

        recognition: src.awards.map(function(awd){
          return {
            title: awd.title,
            date: awd.date,
            summary: awd.summary,
            from: awd.awarder,
            url: null
          };
        }),

        social: src.basics.profiles.map(function(pro){
          return {
            label: pro.network,
            network: pro.network,
            url: pro.url,
            user: pro.username
          };
        }),

        interests: src.interests,
        references: src.references,
        languages: src.languages,
        disposition: src.disposition // <--> round-trip
      };
    },

    /**
    Convert from FRESH format to JSON Resume.
    @param foreign True if non-JSON-Resume properties should be included in
    the result, false if those properties should be excluded.
    */
    toJRS: function( src, foreign ) {

      foreign = (foreign === undefined || foreign === null) ? false : foreign;

      return {

        basics: {
          name: src.name,
          label: src.info.label,
          class: foreign ? src.info.class : undefined,
          summary: src.info.brief,
          website: src.contact.website,
          phone: src.contact.phone,
          email: src.contact.email,
          picture: src.info.image,
          location: {
            address: src.location.address,
            postalCode: src.location.code,
            city: src.location.city,
            countryCode: src.location.country,
            region: src.location.region
          },
          profiles: src.social.map(function(soc){
            return {
              network: soc.network,
              username: soc.user,
              url: soc.url
            };
          })
        },

        work: src.employment.history.map(function(emp){
          return {
            company: emp.employer,
            website: emp.url,
            position: emp.position,
            startDate: emp.start,
            endDate: emp.end,
            summary: emp.summary,
            highlights: emp.highlights
          };
        }),

        education: src.education.history.map(function(edu){
          return {
            institution: edu.institution,
            gpa: edu.grade,
            courses: edu.curriculum,
            startDate: edu.start,
            endDate: edu.end,
            area: edu.area,
            studyType: edu.studyType
          };
        }),

        skills: skillsToJRS( src.skills ),

        volunteer: src.service.history.map(function(srv){
          return {
            flavor: foreign ? srv.flavor : undefined,
            organization: srv.organization,
            position: srv.position,
            startDate: srv.start,
            endDate: srv.end,
            website: srv.url,
            summary: srv.summary,
            highlights: srv.highlights
          };
        }),

        awards: src.recognition.map(function(awd){
          return {
            flavor: foreign ? awd.flavor : undefined,
            url: foreign ? awd.url: undefined,
            title: awd.title,
            date: awd.date,
            awarder: awd.from,
            summary: awd.summary
          };
        }),

        publications: src.writing.map(function(pub){
          return {
            name: pub.title,
            publisher: pub.publisher,
            releaseDate: pub.date,
            website: pub.url,
            summary: pub.summary
          };
        }),

        interests: src.interests,
        references: src.references,
        samples: foreign ? src.samples : undefined,
        disposition: foreign ? src.disposition : undefined,
        languages: src.languages

      };

    }

  };

  function meta( direction, obj ) {
    if( direction ) {
      obj = obj || { };
      obj.format = obj.format || "FRESH@0.1.0";
      obj.version = obj.version || "0.1.0";
    }
    return obj;
  }

  function skillsToFRESH( skills ) {

    return {
      sets: skills.map(function(set) {
        return {
          name: set.name,
          level: set.level,
          skills: set.keywords
        };
      })
    };
  }

  function skillsToJRS( skills ) {
    var ret = [];
    if( skills.sets && skills.sets.length ) {
      ret = skills.sets.map(function(set){
        return {
          name: set.name,
          level: set.level,
          keywords: set.skills
        };
      });
    }
    else if( skills.list ) {
      ret = skills.list.map(function(sk){
        return {
          name: sk.name,
          level: sk.level,
          keywords: sk.keywords
        };
      });
    }
    return ret;
  }



}());
